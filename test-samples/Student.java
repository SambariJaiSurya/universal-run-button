public class Student {
    private String name;
    private int score;

    public Student(String name, int score) {
        this.name = name;
        this.score = score;
    }

    public static void main(String[] args) {
        Student s = new Student("Alice", 98);
        System.out.println("Student: " + s.name + " scored " + s.score);
    }
}
