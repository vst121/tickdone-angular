import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { TodoService } from './todo.service';
import { Todo } from './todo.model';

@Component({
  selector: 'app-todo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './todo.component.html',
  styleUrls: ['./todo.component.css']
})
export class TodoComponent implements OnInit {
  todos: Todo[] = [];
  loading = true;
  error: string | null = null;
  filter: 'all' | 'active' | 'completed' = 'all';
  deleteId: number | null = null;

  todoForm: FormGroup;

  constructor(private fb: FormBuilder, private todoService: TodoService) {
    this.todoForm = this.fb.group({
      taskName: ['', Validators.required],
      deadline: ['']
    });
  }

  ngOnInit(): void {
    this.loadTodos();
  }

  loadTodos(): void {
    this.todoService.getTodos().subscribe({
      next: (data) => {
        this.todos = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching todos:', err);
        this.error = 'An unexpected error occurred while fetching the todos.';
        this.todos = [];
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.todoForm.invalid) return;

    this.error = null;

    const formValue = this.todoForm.value;
    const newTodoData = {
      taskName: formValue.taskName.trim(),
      deadline: formValue.deadline ? new Date(formValue.deadline).toISOString() : null,
    };

    this.todoService.createTodo(newTodoData).subscribe({
      next: (createdTodo) => {
        this.todos = [...this.todos, createdTodo];
        this.todoForm.reset();
      },
      error: (err) => {
        console.error('Error creating todo:', err);
        this.error = 'An unexpected error occurred while creating the todo.';
      }
    });
  }

  handleDelete(id: number): void {
    this.deleteId = id;
  }

  handleConfirmDelete(): void {
    if (!this.deleteId) return;

    this.error = null;

    this.todoService.deleteTodo(this.deleteId).subscribe({
      next: () => {
        this.todos = this.todos.filter(todo => todo.id !== this.deleteId);
        this.deleteId = null;
      },
      error: (err) => {
        console.error('Error deleting todo:', err);
        this.error = 'Failed to delete todo';
        this.deleteId = null;
      }
    });
  }

  handleCancelDelete(): void {
    this.deleteId = null;
  }

  handleDoneToggle(id: number): void {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return;

    this.error = null;

    const updatedTodo = { ...todo, done: !todo.done };

    this.todoService.updateTodo(id, updatedTodo).subscribe({
      next: (result) => {
        this.todos = this.todos.map(t => t.id === id ? result : t);
      },
      error: (err) => {
        console.error('Error updating todo:', err);
        this.error = 'Failed to update todo';
      }
    });
  }

  isOverdue(todo: Todo): boolean {
    return !!(todo.deadline && new Date(todo.deadline) < new Date() && !todo.done);
  }

  get filteredTodos(): Todo[] {
    return this.todos.filter(todo => {
      if (this.filter === 'all') return true;
      if (this.filter === 'active') return !todo.done && !this.isOverdue(todo);
      if (this.filter === 'completed') return todo.done;
      return true;
    });
  }

  get itemsLeft(): number {
    return this.filteredTodos.length;
  }
}