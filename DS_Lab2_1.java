import java.util.Arrays;

public class DS_Lab2_1 {
    public static void main(String[] args) {
        int[]x={1,2,3,4,5};
        System.out.println(Arrays.toString(x));
        System.out.println("inverted =");
        System.out.println(Arrays.toString(inverted(x)));
    }
    public static int[] inverted(int[]x){
        int t=x.length-1;
        for (int i = 0; i < x.length/2; i++) {
            int temp=x[i];
            x[i]=x[t];
            x[t]=temp;
            t--;

        }
        return x;
    }
}


