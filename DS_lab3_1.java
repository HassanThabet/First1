import java.util.Stack;

public class DS_lab3_1 {
    public static void main(String[] args) {
        Stack<Object> S = new Stack();
        Stack<Object> T = new Stack();
        S.push("H");
        S.push("A");
        S.push("S");
        S.push("S");
        S.push("A");
        S.push("N");
        System.out.println("Stack s = " + S);
        System.out.println("S size = " + S.size());
        int t = S.size();

        for(int i = 0; i < t; ++i) {
            T.push(S.pop());
        }

        System.out.println("Stack T =" + T);
    }
}