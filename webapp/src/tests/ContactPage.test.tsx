// Importing.
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ContactPage from "@/app/contact/page";
import "@testing-library/jest-dom";

// Global fetch function to simulate a successful server response.
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ status: "success" }), // Simulated API response.
  })
) as jest.Mock;

describe("ContactPage", () => {
  // Runs before each test to reset any previous mocks.
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Test 1: Checking if the page renders correctly.
  it("renders the Contact Us heading", () => {
    render(<ContactPage />);
    expect(screen.getByText(/Contact Us/i)).toBeInTheDocument(); // Assert the heading exists.
  });

  // Test 2: Checking validation message appears when required fields are empty.
  it("shows validation error if required fields are empty but form touched", async () => {
    render(<ContactPage />);

    const emailInput = screen.getByPlaceholderText(/example/i);
    fireEvent.change(emailInput, { target: { value: "john@example.com" } });

    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Name is required/i)).toBeInTheDocument();
    });
  });

  // Test 3: Checking for email format validation error.
  it("shows error for invalid email", async () => {
    render(<ContactPage />);

    // Valid name.
    const nameInput = screen.getByText("Full Name").nextElementSibling as HTMLElement;
    fireEvent.change(nameInput, { target: { value: "John Doe" } });

    // Invalid email address.
    fireEvent.change(screen.getByPlaceholderText(/example/i), {
      target: { value: "invalid-email" }, // Invalid format.
    });

    const messageInput = screen.getByText("Message").nextElementSibling as HTMLElement;
    fireEvent.change(messageInput, {
      target: { value: "This is a test message" },
    });

    // Submitting form.
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    // Expecting invalid email error.
    await waitFor(() => {
      expect(screen.getByText(/Invalid email/i)).toBeInTheDocument();
    });
  });

  // Test 4: Checking if the form submits successfully when all fields are valid.
  it("submits the form successfully", async () => {
    render(<ContactPage />);

    // Valid name.
    fireEvent.change(screen.getByText("Full Name").nextElementSibling as HTMLElement, {
      target: { value: "John Doe" },
    });

    // Valid email.
    fireEvent.change(screen.getByPlaceholderText(/example/i), {
      target: { value: "john@example.com" },
    });

    // Valid message.
    fireEvent.change(screen.getByText("Message").nextElementSibling as HTMLElement, {
      target: { value: "Hello, this is a test message." },
    });

    // Submitting form.
    const submitButton = screen.getByRole("button", { name: /submit/i });
    fireEvent.click(submitButton);

    // Expecting success message to appear.
    await waitFor(() => {
      expect(screen.getByText(/Submission Completed/i)).toBeInTheDocument();
    });
  });
});