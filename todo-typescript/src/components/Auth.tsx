import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../firebase/firebase";

function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    try {
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);

        await signOut(auth);

        setIsRegister(false);
        setEmail("");
        setPassword("");
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.log(error);
      setError("Invalid email or password");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-96 rounded-lg bg-white p-6 shadow-md"
      >
        <h1 className="mb-6 text-2xl font-bold">
          {isRegister ? "Create Account" : "Login"}
        </h1>

        <input
          type="email"
          placeholder="Enter email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2"
          required
        />

        <input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded border px-3 py-2"
          required
        />

        {error && <p className="mb-4 text-red-500">{error}</p>}

        <button
          type="submit"
          className="w-full rounded bg-blue-500 px-4 py-2 text-white"
        >
          {isRegister ? "Register" : "Login"}
        </button>

        <button
          type="button"
          onClick={() => setIsRegister(!isRegister)}
          className="mt-4 w-full text-blue-500"
        >
          {isRegister
            ? "Already have an account? Login"
            : "Don't have an account? Register"}
        </button>
      </form>
    </div>
  );
}

export default Auth;
