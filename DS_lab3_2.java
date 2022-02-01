import java.util.Stack;

public class DS_lab3_2 {
static int counter=0;
static Stack<Object>Stack2=new Stack<>();
    public static String pop(){
        while (!Stack2.isEmpty()) {

            System.out.println("deleted = " + Stack2.pop());
            System.out.println("size=" + Stack2.size());
            System.out.println("is the stack empty ? " + Stack2.isEmpty());
        }
        return "No Stack is  Empty \n Stack = "+Stack2;
    }

    public static void main(String[] args) {
        Stack2.push("H");
        Stack2.push("A");
        Stack2.push("S");
        Stack2.push("S");
        Stack2.push("A");
        Stack2.push("N");
        System.out.println("Element pushed to Stack ");
        System.out.println("Stack = "+Stack2);
        System.out.println(pop());

    }
}
