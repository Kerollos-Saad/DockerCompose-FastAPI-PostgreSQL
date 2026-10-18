import { Component, OnInit, inject, signal } from '@angular/core';
import { Todo } from './todo.model';
import { TodoService } from './todo.service';

@Component({
  selector: 'app-todo-list',
  standalone: true,
  templateUrl: './todo-list.component.html',
  styleUrl: './todo-list.component.css',
})
export class TodoListComponent implements OnInit {
  private readonly todoService = inject(TodoService);

  protected readonly todos = signal<Todo[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly newTodoTitle = signal('');
  protected readonly adding = signal(false);
  protected readonly pendingTodoIds = signal<ReadonlySet<number>>(new Set());
  protected readonly errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.todoService.getAll().subscribe({
      next: (todos) => {
        this.todos.set(todos);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.showError('load todos');
        this.loading.set(false);
      },
    });
  }

  protected onTitleInput(event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      this.newTodoTitle.set(event.target.value);
    }
  }

  protected addTodo(event: Event): void {
    event.preventDefault();
    const title = this.newTodoTitle().trim();
    if (!title || this.adding()) {
      return;
    }
    this.adding.set(true);
    this.adding.set(true);
    this.todoService.add(title).subscribe({
      next: (todo) => {
        this.todos.update((todos) => [...todos, todo]);
        this.newTodoTitle.set('');
        this.adding.set(false);
      },
      error: () => {
        this.showError('add todo');
        this.adding.set(false);
      },
    });
  }

  protected onCompletedChange(todo: Todo, event: Event): void {
    if (event.target instanceof HTMLInputElement) {
      const completed = event.target.checked;
      event.target.checked = todo.completed;
      this.setCompleted(todo, completed);
    }
  }

  protected setCompleted(todo: Todo, completed: boolean): void {
    if (this.pendingTodoIds().has(todo.id)) {
      return;
    }
    this.setTodoPending(todo.id, true);
    this.setTodoPending(todo.id, true);
    this.todoService.setCompleted(todo.id, completed).subscribe({
      next: (updatedTodo) => {
        this.todos.update((todos) =>
          todos.map((currentTodo) => (currentTodo.id === todo.id ? updatedTodo : currentTodo)),
        );
        this.setTodoPending(todo.id, false);
      },
      error: () => {
        this.showError('update todo');
        this.setTodoPending(todo.id, false);
      },
    });
  }

  protected removeTodo(todo: Todo): void {
    if (this.pendingTodoIds().has(todo.id)) {
      return;
    }
    this.setTodoPending(todo.id, true);
    this.setTodoPending(todo.id, true);
    this.todoService.remove(todo.id).subscribe({
      next: () => {
        this.todos.update((todos) => todos.filter((currentTodo) => currentTodo.id !== todo.id));
        this.setTodoPending(todo.id, false);
      },
      error: () => {
        this.showError('delete todo');
        this.setTodoPending(todo.id, false);
      },
    });
  }

  private setTodoPending(id: number, pending: boolean): void {
    this.pendingTodoIds.update((pendingIds) => {
      const nextPendingIds = new Set(pendingIds);
      if (pending) {
        nextPendingIds.add(id);
      } else {
        nextPendingIds.delete(id);
      }
      return nextPendingIds;
    });
  }

  protected dismissError(): void {
    this.errorMessage.set(null);
  }

  private showError(action: string): void {
    this.errorMessage.set(`Unable to ${action}. Check the backend and try again.`);
  }
}
