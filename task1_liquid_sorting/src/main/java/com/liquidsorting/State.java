package com.liquidsorting;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;
import java.util.Stack;

/**
 * Класс, представляющий состояние всего игрового поля в конкретный момент времени.
 * Реализует Comparable для A* поиска, используя f-cost = gCost + hCost.
 */
public class State implements Comparable<State> {
    private final List<Tube> tubes;
    private final String lastMoveDescription; 
    private final State parentState; 
    
    // g-cost: Фактическое количество ходов от начального состояния
    private final int gCost; 
    // h-cost: Эвристическая оценка, приблизительное количество ходов до решения
    private final int hCost; 
    // f-cost = gCost + hCost (для приоритета в A* поиске)
    private final int fCost;

    public State(List<Tube> tubes, String lastMoveDescription, State parentState, int gCost) {
        this.tubes = tubes;
        this.lastMoveDescription = lastMoveDescription;
        this.parentState = parentState;
        this.gCost = gCost;
        
        // Расчет эвристики (hCost) и общей стоимости (fCost)
        this.hCost = calculateHeuristic();
        this.fCost = this.gCost + this.hCost;
    }

    /**
     * Эвристическая функция для A* (hCost). 
     * Оценивает количество капель, которые нужно переложить.
     * Эвристика: Сумма капель, которые лежат не на своем месте (либо под другим цветом, либо не на своем однородном слое).
     * 
     * Считаем количество сегментов (групп одного цвета), которые не являются полными пробирками. 
     * Каждый лишний сегмент требует как минимум одного хода для своего перемещения.
     */
    private int calculateHeuristic() {
        int segmentsToMove = 0;
        
        for (Tube tube : tubes) {
            if (tube.isEmpty() || tube.isCompleted()) {
                continue; // Пустая или завершенная пробирка не требует действий
            }
            
            Stack<Integer> layers = tube.getLayers();
            if (layers.isEmpty()) continue;
            
            int currentSegmentColor = layers.get(layers.size() - 1); // Цвет верхнего сегмента
            int segmentCount = 1; // Всегда начинается с 1
            
            // Ищем количество капель в верхнем сегменте
            for (int i = layers.size() - 2; i >= 0; i--) {
                if (layers.get(i).equals(currentSegmentColor)) {
                    segmentCount++;
                } else {
                    // Нашли начало нового сегмента
                    segmentsToMove++;
                    currentSegmentColor = layers.get(i);
                }
            }
            // Добавляем сегмент, который находится на дне (если он не часть верхнего)
            if (layers.size() > 0) {
                 segmentsToMove++;
            }
        }
        
        // Чем меньше сегментов, тем лучше. Минимальное количество сегментов равно количеству цветов (если все пробирки собраны).
        // Количество сегментов, которые нужно переложить (не включая уже полные пробирки).
        return segmentsToMove;
    }

    /**
     * Проверяет, является ли состояние собранным (все пробирки отсортированы).
     */
    public boolean isSolved() {
        for (Tube tube : tubes) {
            if (!tube.isCompleted()) {
                return false;
            }
        }
        return true;
    }

    /**
     * Генерирует все возможные следующие состояния.
     */
    public List<State> getNextStates() {
        List<State> nextStates = new ArrayList<>();

        for (int i = 0; i < tubes.size(); i++) {
            // Не переливаем из уже завершенной пробирки
            if (tubes.get(i).isCompleted() && !tubes.get(i).isEmpty()) continue; 
            
            for (int j = 0; j < tubes.size(); j++) {
                if (i == j) continue;

                Tube source = tubes.get(i);
                Tube target = tubes.get(j);
                
                // Не переливаем в завершенную пробирку
                if (target.isCompleted() && !target.isEmpty()) continue;

                if (source.canPourInto(target)) {
                    // Создаем копию пробирок для нового состояния
                    List<Tube> newTubes = copyTubes();
                    
                    // Выполняем переливание на копиях
                    Tube newSource = newTubes.get(i);
                    Tube newTarget = newTubes.get(j);
                    
                    // Если переливание меняет состояние
                    if (newSource.pourInto(newTarget)) {
                        String move = String.format("(%2d, %2d)", i, j);
                        // gCost увеличивается на 1
                        nextStates.add(new State(newTubes, move, this, this.gCost + 1));
                    }
                }
            }
        }
        return nextStates;
    }

    private List<Tube> copyTubes() {
        List<Tube> list = new ArrayList<>(tubes.size());
        for (Tube t : tubes) {
            list.add(t.copy());
        }
        return list;
    }

    public String getLastMoveDescription() {
        return lastMoveDescription;
    }

    public State getParentState() {
        return parentState;
    }
    
    public int getGCost() {
        return gCost;
    }
    
    // Реализация Comparable для PriorityQueue
    @Override
    public int compareTo(State other) {
        // Сравниваем по f-cost. Чем меньше, тем выше приоритет.
        return Integer.compare(this.fCost, other.fCost);
    }
    
    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        State state = (State) o;
        // Для visited Set достаточно сравнивать только конфигурацию пробирок
        return Objects.equals(tubes, state.tubes);
    }

    @Override
    public int hashCode() {
        return Objects.hash(tubes);
    }
    
    @Override
    public String toString() {
        return tubes.toString();
    }
}