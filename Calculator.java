import java.util.Scanner;

/**
 * Calculator
 * ----------
 * A menu-driven console calculator supporting basic arithmetic as well as
 * higher-degree mathematical operations. Designed to run in any plain
 * Java compiler/runner (single file, no external dependencies).
 *
 * Handles invalid input, edge cases, and mathematically undefined
 * operations gracefully, printing a clear error instead of crashing.
 */
public class Calculator {

    private static final Scanner scanner = new Scanner(System.in);
    private static final double EPSILON = 1e-9;

    public static void main(String[] args) {
        printBanner();
        boolean running = true;

        while (running) {
            printMenu();
            int choice = readMenuChoice();

            if (choice == 0) {
                System.out.println("\nExiting Calculator. Goodbye!");
                running = false;
                continue;
            }
            if (choice == -1) {
                // Invalid, non-numeric menu input already reported by readMenuChoice()
                continue;
            }

            try {
                switch (choice) {
                    case 1 -> binaryOp("Addition", (a, b) -> a + b);
                    case 2 -> binaryOp("Subtraction", (a, b) -> a - b);
                    case 3 -> binaryOp("Multiplication", (a, b) -> a * b);
                    case 4 -> divide();
                    case 5 -> modulus();
                    case 6 -> power();
                    case 7 -> squareRoot();
                    case 8 -> nthRoot();
                    case 9 -> logarithm();
                    case 10 -> naturalLog();
                    case 11 -> trig();
                    case 12 -> factorial();
                    case 13 -> exponential();
                    default -> System.out.println("Result: Invalid menu option. Please choose 0-13.");
                }
            } catch (CalculatorException ce) {
                // Expected mathematical/domain errors -> clear, concise message
                System.out.println("Error: " + ce.getMessage());
            } catch (Exception e) {
                // Safety net for any unforeseen failure; calculator keeps running
                System.out.println("Error: Unable to perform operation (" + e.getClass().getSimpleName() + ").");
            }

            System.out.println("------------------------------------------------");
        }
        scanner.close();
    }

    // ---------------------------------------------------------------
    // Menu / UI helpers
    // ---------------------------------------------------------------

    private static void printBanner() {
        System.out.println("==================================================");
        System.out.println("           JAVA SCIENTIFIC CALCULATOR            ");
        System.out.println("==================================================");
    }

    private static void printMenu() {
        System.out.println("\nSelect an operation:");
        System.out.println(" 1  - Addition (a + b)");
        System.out.println(" 2  - Subtraction (a - b)");
        System.out.println(" 3  - Multiplication (a * b)");
        System.out.println(" 4  - Division (a / b)");
        System.out.println(" 5  - Modulus (a % b)");
        System.out.println(" 6  - Power (a ^ b)");
        System.out.println(" 7  - Square Root (sqrt a)");
        System.out.println(" 8  - Nth Root (a ^ 1/n)");
        System.out.println(" 9  - Logarithm base 10 (log10 a)");
        System.out.println("10  - Natural Logarithm (ln a)");
        System.out.println("11  - Trigonometry (sin/cos/tan, degrees)");
        System.out.println("12  - Factorial (n!)");
        System.out.println("13  - Exponential (e^a)");
        System.out.println(" 0  - Exit");
        System.out.print("Enter choice: ");
    }

    private static int readMenuChoice() {
        String line = scanner.nextLine().trim();
        try {
            return Integer.parseInt(line);
        } catch (NumberFormatException e) {
            System.out.println("Result: Invalid input. Please enter a whole number for the menu choice.");
            return -1;
        }
    }

    /** Reads a double from the console with a prompt; throws CalculatorException on bad input. */
    private static double readDouble(String prompt) {
        System.out.print(prompt);
        String line = scanner.nextLine().trim();
        try {
            double value = Double.parseDouble(line);
            if (Double.isNaN(value) || Double.isInfinite(value)) {
                throw new CalculatorException("Input must be a finite real number.");
            }
            return value;
        } catch (NumberFormatException e) {
            throw new CalculatorException("Invalid numeric input: \"" + line + "\" is not a valid number.");
        }
    }

    /** Reads an integer from the console; throws CalculatorException on bad or non-integer input. */
    private static long readInteger(String prompt) {
        double value = readDouble(prompt);
        if (value != Math.floor(value)) {
            throw new CalculatorException("Input must be a whole number (no decimals).");
        }
        return (long) value;
    }

    @FunctionalInterface
    private interface Operation {
        double apply(double a, double b);
    }

    // ---------------------------------------------------------------
    // Arithmetic operations
    // ---------------------------------------------------------------

    private static void binaryOp(String name, Operation op) {
        double a = readDouble("Enter first number: ");
        double b = readDouble("Enter second number: ");
        double result = op.apply(a, b);
        printResult(name, result);
    }

    private static void divide() {
        double a = readDouble("Enter numerator: ");
        double b = readDouble("Enter denominator: ");
        if (b == 0) {
            throw new CalculatorException("Division by zero is undefined.");
        }
        printResult("Division", a / b);
    }

    private static void modulus() {
        double a = readDouble("Enter first number: ");
        double b = readDouble("Enter second number (divisor): ");
        if (b == 0) {
            throw new CalculatorException("Modulus by zero is undefined.");
        }
        printResult("Modulus", a % b);
    }

    // ---------------------------------------------------------------
    // Higher-degree mathematical operations
    // ---------------------------------------------------------------

    private static void power() {
        double base = readDouble("Enter base: ");
        double exp = readDouble("Enter exponent: ");

        if (base == 0 && exp < 0) {
            throw new CalculatorException("0 raised to a negative power is undefined (division by zero).");
        }
        if (base < 0 && exp != Math.floor(exp)) {
            throw new CalculatorException("Negative base with a fractional exponent produces a complex result, which this calculator does not support.");
        }
        double result = Math.pow(base, exp);
        if (Double.isInfinite(result)) {
            throw new CalculatorException("Result is too large to represent (overflow).");
        }
        printResult("Power", result);
    }

    private static void squareRoot() {
        double a = readDouble("Enter number: ");
        if (a < 0) {
            throw new CalculatorException("Square root of a negative number is undefined for real numbers.");
        }
        printResult("Square Root", Math.sqrt(a));
    }

    private static void nthRoot() {
        double a = readDouble("Enter number: ");
        double n = readDouble("Enter root degree (n): ");
        if (n == 0) {
            throw new CalculatorException("0th root is undefined.");
        }
        boolean nIsOddInteger = (n == Math.floor(n)) && (((long) n) % 2 != 0);
        if (a < 0 && !nIsOddInteger) {
            // negative number with an even, or non-integer, root degree -> not a real number
            throw new CalculatorException("Root of a negative number with this degree is not a real number.");
        }
        double result = (a < 0) ? -Math.pow(-a, 1.0 / n) : Math.pow(a, 1.0 / n);
        if (Double.isNaN(result) || Double.isInfinite(result)) {
            throw new CalculatorException("Root could not be computed for the given inputs.");
        }
        printResult("Nth Root", result);
    }

    private static void logarithm() {
        double a = readDouble("Enter number: ");
        if (a <= 0) {
            throw new CalculatorException("Logarithm is undefined for zero or negative numbers.");
        }
        printResult("Log10", Math.log10(a));
    }

    private static void naturalLog() {
        double a = readDouble("Enter number: ");
        if (a <= 0) {
            throw new CalculatorException("Natural logarithm is undefined for zero or negative numbers.");
        }
        printResult("Natural Log (ln)", Math.log(a));
    }

    private static void trig() {
        System.out.print("Choose function - sin, cos, or tan: ");
        String fn = scanner.nextLine().trim().toLowerCase();
        double degrees = readDouble("Enter angle in degrees: ");
        double radians = Math.toRadians(degrees);

        double result;
        switch (fn) {
            case "sin" -> result = Math.sin(radians);
            case "cos" -> result = Math.cos(radians);
            case "tan" -> {
                double cos = Math.cos(radians);
                if (Math.abs(cos) < EPSILON) {
                    throw new CalculatorException("Tangent is undefined at " + degrees + " degrees (cosine is zero).");
                }
                result = Math.tan(radians);
            }
            default -> throw new CalculatorException("Unknown trig function \"" + fn + "\". Use sin, cos, or tan.");
        }
        printResult("Trigonometry (" + fn + ")", result);
    }

    private static void factorial() {
        long n = readInteger("Enter a non-negative whole number: ");
        if (n < 0) {
            throw new CalculatorException("Factorial is undefined for negative numbers.");
        }
        if (n > 20) {
            throw new CalculatorException("Input too large; factorial result would overflow (max supported: 20).");
        }
        long result = 1;
        for (long i = 2; i <= n; i++) {
            result *= i;
        }
        printResult("Factorial", result);
    }

    private static void exponential() {
        double a = readDouble("Enter exponent (a) for e^a: ");
        double result = Math.exp(a);
        if (Double.isInfinite(result)) {
            throw new CalculatorException("Result is too large to represent (overflow).");
        }
        printResult("Exponential (e^a)", result);
    }

    // ---------------------------------------------------------------
    // Output helpers
    // ---------------------------------------------------------------

    private static void printResult(String opName, double result) {
        if (result == Math.floor(result) && !Double.isInfinite(result)) {
            System.out.printf("Result [%s]: %d%n", opName, (long) result);
        } else {
            System.out.printf("Result [%s]: %.6f%n", opName, result);
        }
    }

    private static void printResult(String opName, long result) {
        System.out.printf("Result [%s]: %d%n", opName, result);
    }

    /** Custom checked-style exception (unchecked) for expected mathematical/input errors. */
    private static class CalculatorException extends RuntimeException {
        public CalculatorException(String message) {
            super(message);
        }
    }
}
