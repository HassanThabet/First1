import java.util.Arrays;

public class DS_lab2_2 {
    public static void main(String[] args) {
        int[]x={1,2,3,4,5};
        System.out.println(Arrays.toString(x));
        System.out.println("copy =");
        int [] new_x=(int[])Arrays.copyOf(x,5);
        for (int j = 0; j < 1; j++) {
            System.out.println(Arrays.toString(new_x));
        }
    }

}
