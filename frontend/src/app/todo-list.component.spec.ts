import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { Todo } from './todo.model';
import { TodoService } from './todo.service';
import { TodoListComponent } from './todo-list.component';

describe('TodoListComponent', () => {
  let fixture: ComponentFixture<TodoListComponent>;
  let todosSubject: Subject<Todo[]>;

  beforeEach(async () => {
    todosSubject = new Subject<Todo[]>();

    await TestBed.configureTestingModule({
      imports: [TodoListComponent],
      providers: [
        {
          provide: TodoService,
          useValue: { getAll: () => todosSubject.asObservable() },
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
});
