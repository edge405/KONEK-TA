import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await login(data);
      if (result.success) {
        toast.success("Welcome back!");
        navigate("/");
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : result.error?.detail || result.error?.non_field_errors?.[0] || "Login failed";
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Sign in to KONEK TA
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Input
            label="Username"
            placeholder="Enter your username"
            error={errors.username?.message}
            {...register("username", { required: "Username is required" })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Enter your password"
            error={errors.password?.message}
            {...register("password", { required: "Password is required" })}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Sign in
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Don&apos;t have an account?{" "}
          <Link
            to="/register"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Create one
          </Link>
        </p>
      </Card>
    </div>
  );
}
