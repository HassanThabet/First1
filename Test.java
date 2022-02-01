import java.util.Arrays;
import java.util.Scanner;

public class Test {
    public static void main(String[] args) {
        ArrayStack<Integer> myStack = new ArrayStack<>(5);
        Scanner input = new Scanner(System.in);
        System.out.println("is the stack empty ? " + myStack.isEmpty());
        System.out.println("input stack elements ");
        for (int i = 0; i < 5; i++) {
            myStack.push(input.nextInt());
            System.out.println("top=" + myStack.top());
            System.out.println("size=" + myStack.size());
            System.out.println("is the stack empty ? " + myStack.isEmpty());
        }
        while (!myStack.isEmpty()) {

            System.out.println("deleted = " + myStack.pop());
            System.out.println("top=" + myStack.top());
            System.out.println("size=" + myStack.size());
            System.out.println("is the stack empty ? " + myStack.isEmpty());
        }
    }
}
