import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import Card from "../components/ui/Card";
import Input from "../components/ui/Input";
import Button from "../components/ui/Button";

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const password = watch("password");

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const result = await registerUser(data);
      if (result.success) {
        toast.success("Account created successfully!");
        navigate("/");
      } else {
        const errorMsg =
          typeof result.error === "string"
            ? result.error
            : result.error?.detail ||
              result.error?.username?.[0] ||
              result.error?.email?.[0] ||
              result.error?.non_field_errors?.[0] ||
              "Registration failed";
        toast.error(errorMsg);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-12">
      <Card className="w-full max-w-md p-8">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 mb-4">
            <span className="text-white font-bold text-2xl">K</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Create your account
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Join KONEK TA today
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="First name"
              placeholder="John"
              error={errors.first_name?.message}
              {...register("first_name", {
                required: "First name is required",
              })}
            />
            <Input
              label="Last name"
              placeholder="Doe"
              error={errors.last_name?.message}
              {...register("last_name", {
                required: "Last name is required",
              })}
            />
          </div>
          <Input
            label="Username"
            placeholder="johndoe"
            error={errors.username?.message}
            {...register("username", {
              required: "Username is required",
              minLength: { value: 3, message: "At least 3 characters" },
            })}
          />
          <Input
            label="Email"
            type="email"
            placeholder="john@example.com"
            error={errors.email?.message}
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Invalid email address",
              },
            })}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            error={errors.password?.message}
            {...register("password", {
              required: "Password is required",
              minLength: { value: 8, message: "At least 8 characters" },
            })}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter your password"
            error={errors.password_confirm?.message}
            {...register("password_confirm", {
              required: "Please confirm your password",
              validate: (value) =>
                value === password || "Passwords do not match",
            })}
          />
          <Button type="submit" className="w-full" loading={loading}>
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
          Already have an account?{" "}
          <Link
            to="/login"
            className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 font-medium"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  );
}
