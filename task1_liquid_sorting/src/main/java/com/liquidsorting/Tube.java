package com.liquidsorting;

import java.util.Objects;
import java.util.Stack;

/**
 * Класс, представляющий одну пробирку.
 */
public class Tube {
    private final int capacity;
    private final Stack<Integer> layers;

    public Tube(int capacity) {
        this.capacity = capacity;
        this.layers = new Stack<>();
    }

    // Конструктор для копирования цветов жидкостей в пробирку
    private Tube(int capacity, Stack<Integer> layers) {
        this.capacity = capacity;
        this.layers = new Stack<>();
        this.layers.addAll(layers);
    }

    // Добавить один цвет в пробирку
    public void addColor(int color) {
        if (layers.size() < capacity) {
            layers.push(color);
        } else {
            throw new IllegalStateException("Tube is full");
        }
    }

    public boolean isEmpty() {
        return layers.isEmpty();
    }

    public boolean isFull() {
        return layers.size() == capacity;
    }

    public Integer getTopColor() {
        if (isEmpty()) return null;
        return layers.peek();
    }

    public Stack<Integer> getLayers() {
        return layers;
    }

    /**
     * Проверяет, завершена ли пробирка (либо пустая, либо полная одним цветом).
     */
    public boolean isCompleted() {
        if (isEmpty()) return true;
        if (!isFull()) return false;
        
        int color = layers.get(0);
        for (int c : layers) {
            if (c != color) return false;
        }
        return true;
    }

    /**
     * Проверяет возможность переливания ИЗ этой пробирки В другую.
     */
    public boolean canPourInto(Tube target) {
        if (this.isEmpty()) return false; // Нельзя лить из пустой
        if (target.isFull()) return false; // Нельзя лить в полную
        if (this == target) return false; // Нельзя лить в саму себя

        // Переливать можно, если целевая пуста ИЛИ цвета совпадают
        return target.isEmpty() || Objects.equals(target.getTopColor(), this.getTopColor());
    }

    /**
     * Выполняет переливание.
     * @param target целевая пробирка
     * @return true, если переливание состоялось
     */
    public boolean pourInto(Tube target) {
        if (!canPourInto(target)) return false;

        int colorToPour = this.getTopColor();
        
        // Сколько капель одного цвета подряд
        int dropCount = 0;
        // Идем с вершины стека вниз
        for (int i = layers.size() - 1; i >= 0; i--) {
            if (layers.get(i) == colorToPour) {
                dropCount++;
            } else {
                break;
            }
        }

        // Сколько места в целевой пробирке
        int targetSpace = target.capacity - target.layers.size();

        // Сколько можем перелить за один ход
        int amountToMove = Math.min(dropCount, targetSpace);

        for (int i = 0; i < amountToMove; i++) {
            target.layers.push(this.layers.pop());
        }
        
        return true;
    }

    public Tube copy() {
        return new Tube(this.capacity, this.layers);
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Tube tube = (Tube) o;
        return capacity == tube.capacity && Objects.equals(layers, tube.layers);
    }

    @Override
    public int hashCode() {
        return Objects.hash(capacity, layers);
    }

    @Override
    public String toString() {
        return layers.toString();
    }
}