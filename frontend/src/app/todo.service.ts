import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment';
import { Todo } from './todo.model';

@Injectable({
  providedIn: 'root',
})
export class TodoService {
  private readonly http = inject(HttpClient);
  private readonly todosUrl = `${environment.apiUrl}/todos`;

  getAll(): Observable<Todo[]> {
    return this.http.get<Todo[]>(this.todosUrl);
  }

  add(title: string): Observable<Todo> {
    return this.http.post<Todo>(this.todosUrl, { title });
  }

  setCompleted(id: number, completed: boolean): Observable<Todo> {
    return this.http.patch<Todo>(`${this.todosUrl}/${id}`, { completed });
  }

  remove(id: number): Observable<void> {
    return this.http.delete<void>(`${this.todosUrl}/${id}`);
  }
}
