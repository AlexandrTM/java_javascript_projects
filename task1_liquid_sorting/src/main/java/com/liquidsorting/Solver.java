package com.liquidsorting;

import java.util.*;

/**
 * Реализация поиска решения с использованием алгоритма A-star.
 */
public class Solver {

    /**
     * Находит решение головоломки, используя поиск A*.
     * A* использует эвристику для приоритезации состояний, что значительно ускоряет поиск по сравнению с BFS.
     *
     * @param initialState Начальное состояние
     * @return Список строк с описанием ходов или empty list, если решения нет.
     */
    public List<String> solve(State initialState) {
        // PriorityQueue для A*: состояния с меньшим f-cost (g + h) имеют более высокий приоритет
        PriorityQueue<State> openSet = new PriorityQueue<>();
        
        // HashMap для отслеживания посещенных состояний и их лучшего g-cost
        Map<State, Integer> gCostMap = new HashMap<>();

        openSet.add(initialState);
        gCostMap.put(initialState, 0);

        System.out.println("Searching for solution using A*...");
        long startTime = System.currentTimeMillis();

        while (!openSet.isEmpty()) {
            State current = openSet.poll();

            // Проверка на решение
            if (current.isSolved()) {
                System.out.printf("Solution found in %d ms! Visited %d states (Map size).%n", 
                        (System.currentTimeMillis() - startTime), gCostMap.size());
                return reconstructPath(current);
            }

            // Перебираем следующие возможные состояния
            for (State next : current.getNextStates()) {
                int newGCost = next.getGCost(); // G-cost для следующего состояния

                // Если следующее состояние уже было посещено И его текущий g-cost (gCostMap) 
                // меньше или равен новому g-cost, то мы нашли более длинный путь, игнорируем его.
                if (gCostMap.containsKey(next) && newGCost >= gCostMap.get(next)) {
                    continue;
                }

                // Найден лучший (или первый) путь к next. Обновляем и добавляем в openSet.
                gCostMap.put(next, newGCost);
                openSet.add(next);
            }
        }

        System.out.println("No solution found.");
        return Collections.emptyList();
    }

    private List<String> reconstructPath(State state) {
        LinkedList<String> path = new LinkedList<>();
        State current = state;
        while (current.getParentState() != null) {
            path.addFirst(current.getLastMoveDescription());
            current = current.getParentState();
        }
        return path;
    }
}