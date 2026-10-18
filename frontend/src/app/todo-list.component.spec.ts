import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Todo } from './todo.model';
import { TodoService } from './todo.service';
import { TodoListComponent } from './todo-list.component';

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let todosSubject: Subject<Todo[]>;
  let addTodoSubject: Subject<Todo>;
  let addTodo: ReturnType<typeof vi.fn>;
  let completionSubject: Subject<Todo>;
  let setCompleted: ReturnType<typeof vi.fn>;
  let removeSubject: Subject<void>;
  let removeTodo: ReturnType<typeof vi.fn>;

  beforeEach(async () => {
    todosSubject = new Subject<Todo[]>();
    addTodoSubject = new Subject<Todo>();
    addTodo = vi.fn(() => addTodoSubject.asObservable());
    completionSubject = new Subject<Todo>();
    setCompleted = vi.fn(() => completionSubject.asObservable());
    removeSubject = new Subject<void>();
    removeTodo = vi.fn(() => removeSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        {
          provide: TodoService,
          useValue: {
            getAll: () => todosSubject.asObservable(),
            add: addTodo,
            setCompleted,
            remove: removeTodo,
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TodoListComponent);
  });

  it('shows loading and empty states', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Loading...');

    todosSubject.next([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('No todos yet');
  });

  it('renders todos and marks completed titles', () => {
    fixture.detectChanges();
    todosSubject.next([
      { id: 1, title: 'Incomplete task', completed: false },
      { id: 2, title: 'Complete task', completed: true },
    ]);
    fixture.detectChanges();

    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLLIElement>;
    expect(items).toHaveLength(2);
    expect(items[0].textContent).toContain('Incomplete task');
    expect(items[0].classList.contains('completed')).toBe(false);
    expect(items[1].textContent).toContain('Complete task');
    expect(items[1].classList.contains('completed')).toBe(true);
  });

  it('disables Add for blank input and adds a trimmed todo on submit', () => {
    fixture.detectChanges();
    todosSubject.next([{ id: 1, title: 'Existing task', completed: false }]);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    const button = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;

    expect(button.disabled).toBe(true);
    input.value = '   ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(true);
    expect(addTodo).not.toHaveBeenCalled();

    input.value = '  New task  ';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(button.disabled).toBe(false);
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(addTodo).toHaveBeenCalledWith('New task');

    addTodoSubject.next({ id: 2, title: 'New task', completed: false });
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input') as HTMLInputElement).value).toBe('');
    expect(
      Array.from(fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLLIElement>)
        .map((item) => item.querySelector('label')?.textContent?.trim()),
    ).toEqual(['Existing task', 'New task']);
    expect(addTodo).toHaveBeenCalledTimes(1);
  });

  it('submits the form with Enter', () => {
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = 'Keyboard task';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    fixture.detectChanges();
    expect(addTodo).toHaveBeenCalledWith('Keyboard task');
  });

  it('updates a todo from the server response after changing its checkbox', () => {
    fixture.detectChanges();
    todosSubject.next([{ id: 1, title: 'Task', completed: false }]);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    expect(setCompleted).toHaveBeenCalledWith(1, true);
    expect(checkbox.checked).toBe(false);
    expect((fixture.nativeElement.querySelector('li') as HTMLLIElement).classList.contains('completed')).toBe(false);

    completionSubject.next({ id: 1, title: 'Server title', completed: true });
    fixture.detectChanges();
    expect((fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement).checked).toBe(true);
    expect(fixture.nativeElement.querySelector('li label')?.textContent).toContain('Server title');
    expect((fixture.nativeElement.querySelector('li') as HTMLLIElement).classList.contains('completed')).toBe(true);
  });

  it('keeps a todo until delete succeeds', () => {
    fixture.detectChanges();
    todosSubject.next([{ id: 1, title: 'Task', completed: false }]);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector('button[type="button"]') as HTMLButtonElement;
    button.click();
    fixture.detectChanges();

    expect(removeTodo).toHaveBeenCalledWith(1);
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(1);

    removeSubject.next();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(0);
    expect(fixture.nativeElement.textContent).toContain('No todos yet');
  });

  it('shows and dismisses an error banner when loading fails', () => {
    fixture.detectChanges();
    todosSubject.error(new Error('Backend unavailable'));
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement;
    expect(banner.textContent).toContain('Unable to load todos');
    expect(fixture.nativeElement.textContent).not.toContain('No todos yet');

    (banner.querySelector('button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('shows an error banner when adding fails and blocks repeated submits in flight', () => {
    fixture.detectChanges();
    todosSubject.next([]);
    fixture.detectChanges();

    const input = fixture.nativeElement.querySelector('#new-todo-title') as HTMLInputElement;
    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    input.value = 'Task';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    form.dispatchEvent(new SubmitEvent('submit', { bubbles: true, cancelable: true }));
    expect(addTodo).toHaveBeenCalledTimes(1);

    addTodoSubject.error(new Error('Not found'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to add todo',
    );
    expect((fixture.nativeElement.querySelector('#new-todo-title') as HTMLInputElement).value).toBe(
      'Task',
    );
  });

  it('shows errors for item actions and prevents duplicate requests while pending', () => {
    fixture.detectChanges();
    todosSubject.next([{ id: 1, title: 'Task', completed: false }]);
    fixture.detectChanges();

    const checkbox = fixture.nativeElement.querySelector('input[type="checkbox"]') as HTMLInputElement;
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change'));
    checkbox.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(setCompleted).toHaveBeenCalledTimes(1);

    completionSubject.error(new Error('Not found'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to update todo',
    );
    expect((fixture.nativeElement.querySelector('li') as HTMLLIElement).classList.contains('completed')).toBe(
      false,
    );

    const deleteButton = fixture.nativeElement.querySelector(
      'button[type="button"]:not([aria-label])',
    ) as HTMLButtonElement;
    deleteButton.click();
    deleteButton.click();
    fixture.detectChanges();
    expect(removeTodo).toHaveBeenCalledTimes(1);

    removeSubject.error(new Error('Not found'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Unable to delete todo',
    );
    expect(fixture.nativeElement.querySelectorAll('li')).toHaveLength(1);
  });
});
