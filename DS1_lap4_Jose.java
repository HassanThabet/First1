public class DS1_lap4_Jose {

    class Josephus {


        //"n" is the number of player/s(solder/s)
        //"k" is how many player/s(solder/s) to skip them to begin killing.
        static int josephus(int n, int k)
        {
            if (n == 1)
                return 1;
            else
                return (josephus(n - 1, k) + k-1) % n + 1;
        }

        // Driver Program to test above function
        public static void main(String[] args)
        {
            int n = 5;
            int k =2 ;
            System.out.println("The chosen place is " + josephus(n, k));
        }
    }

}

