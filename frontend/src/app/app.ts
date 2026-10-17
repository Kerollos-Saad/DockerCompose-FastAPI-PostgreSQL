import { Component } from '@angular/core';
import { TodoListComponent } from './todo-list.component';

@Component({
  selector: 'app-root',
  imports: [TodoListComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
}
