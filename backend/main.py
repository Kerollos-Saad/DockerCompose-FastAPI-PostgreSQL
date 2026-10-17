import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, Column, Integer, String, Boolean
from sqlalchemy.orm import DeclarativeBase, Session

DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://todos:todos@localhost:5432/todos")

engine = create_engine(DATABASE_URL)


class Base(DeclarativeBase):
    pass

class Todo(Base):
    __tablename__ = "todos"
    
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    completed = Column(String, nullable=False, default=False)
    
Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class TodoCreate(BaseModel):
    title: str
    
class TodoUpdate(BaseModel):
    completed: bool
    
@app.get("/todos")
def get_todos():
    with Session(engine) as session:
        return session.query(Todo).all()
    
@app.post("/todos", status_code=201)
def create_todo(body: TodoCreate):
    with Session(engine) as session:
        todo = Todo(title = body.title)
        session.add(todo)
        session.commit()
        session.refresh(todo)
        return todo
    
@app.patch("/todos/{todo_id}", responses={404: {"description": "Todo not found"}})
def update_todo(todo_id: int, body: TodoUpdate):
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        todo.completed = body.completed
        session.commit()
        session.refresh(todo)
        return todo
    
@app.delete("/todos/{todo_id}", status_code=204, responses={404: {"description": "Todo not found"}})
def delete_todo(todo_id: int):
    with Session(engine) as session:
        todo = session.get(Todo, todo_id)
        if not todo:
            raise HTTPException(status_code=404, detail="Todo not found")
        session.delete(todo)
        session.commit()