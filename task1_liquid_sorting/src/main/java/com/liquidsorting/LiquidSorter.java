package com.liquidsorting;

import java.util.ArrayList;
import java.util.List;

public class LiquidSorter {
    public static void main(String[] args) {
        // N = кол-во пробиров
        // V = объем пробирки 
        int N = 14;
        int V = 4;

        // Исходная матрица
        int[][] inputData = {
            {1, 2, 3, 4},
            {5, 6, 7, 8},
            {9, 10, 11, 12},
            {2, 1, 4, 3},
            {6, 5, 8, 7},
            {10, 9, 12, 11},
            {1, 5, 9, 2},
            {6, 10, 3, 7},
            {11, 4, 8, 12},
            {3, 7, 11, 1},
            {8, 12, 5, 9},
            {4, 10, 2, 6},
            {},
            {}
        };

        System.out.println("Initializing Logic Sorting Puzzle...");

        // Добавляем пробирки в массив
        List<Tube> tubes = new ArrayList<>();  
        for (int i = 0; i < inputData.length; i++) {
            Tube tube = new Tube(V);
            for (int j = 0; j < inputData[i].length; j++) {
                tube.addColor(inputData[i][j]);
            }
            tubes.add(tube);
        }

        // Создаем начальное состояние из пробирок и находим решение
        State initialState = new State(tubes, null, null, 0);
        
        System.out.println("Initial State: " + initialState);

        Solver solver = new Solver();
        List<String> moves = solver.solve(initialState);

        // Записываем движения для решения задачи
        System.out.println("Moves to solve:");
        int counter = 0;
        for (String move : moves) {
            System.out.print(move + " ");
            counter++;
            if (counter % 8 == 0) System.out.println();
        }
        System.out.println("\nTotal moves: " + moves.size());
    }
}
