"use client";

import axios from "axios";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { LoginRequest } from "@repo/shared";
import { z } from "zod";
import { loginRequest } from "./auth-api";
import { HOME_ROUTE } from "./auth-routes";
import { getAuthToken, setAuthToken } from "./auth-storage";
import styles from "./auth-shell.module.css";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .email("Tài khoản phải là một email hợp lệ."),
  password: z
    .string()
    .trim()
    .min(6, "Mật khẩu phải có ít nhất 6 ký tự."),
});

type LoginField = keyof LoginRequest;
type LoginErrors = Partial<Record<LoginField, string>>;

const initialFormState: LoginRequest = {
  email: "",
  password: "",
};

export function LoginForm() {
  const router = useRouter();
  const [form, setForm] = useState<LoginRequest>(initialFormState);
  const [errors, setErrors] = useState<LoginErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (getAuthToken()) {
      router.replace(HOME_ROUTE);
    }
  }, [router]);

  function updateField(field: LoginField, value: string) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: undefined,
    }));
    setSubmitError("");
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const result = loginSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors = result.error.flatten().fieldErrors;

      setErrors({
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      });
      return;
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const session = await loginRequest(result.data);

      setAuthToken(session.accessToken);
      startTransition(() => {
        router.replace(HOME_ROUTE);
      });
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setSubmitError("Tài khoản hoặc mật khẩu không đúng.");
      } else {
        setSubmitError("Không thể đăng nhập vào lúc này. Vui lòng thử lại.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.heroPanel}>
          <div>
            <span className={styles.eyebrow}>Frontend Auth</span>
            <h1 className={styles.headline}>
              Đăng nhập để mở
              <span className={styles.headlineAccent}> phiên làm việc </span>
              bảo vệ bằng JWT.
            </h1>
          </div>

          <p className={styles.lead}>
            Giao diện này kiểm tra dữ liệu bằng Zod, lưu token vào{" "}
            <code>localStorage</code>, tự gắn JWT lên mọi request bằng Axios
            interceptor, và quay lại màn đăng nhập khi backend trả về{" "}
            <code>401</code>.
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroCard}>
              <span className={styles.heroLabel}>Token storage</span>
              <p className={styles.heroValue}>localStorage</p>
            </div>
            <div className={styles.heroCard}>
              <span className={styles.heroLabel}>Session policy</span>
              <p className={styles.heroValue}>401 =&gt; Login</p>
            </div>
          </div>
        </aside>

        <section className={styles.contentPanel}>
          <div>
            <h2 className={styles.sectionTitle}>Đăng nhập hệ thống</h2>
            <p className={styles.sectionLead}>
              Sử dụng tài khoản đã seed ở backend để kiểm thử nhanh giao diện
              auth.
            </p>
          </div>

          <div className={styles.hintBox}>
            <span className={styles.hintLabel}>Tài khoản dev mặc định</span>
            <p>
              <strong>admin@example.com</strong> / <strong>admin123</strong>
            </p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit} noValidate>
            <label className={styles.field}>
              <span className={styles.label}>Tài khoản</span>
              <input
                className={styles.input}
                type="email"
                value={form.email}
                onChange={(event) => updateField("email", event.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
              />
              {errors.email ? (
                <span className={styles.fieldError}>{errors.email}</span>
              ) : null}
            </label>

            <label className={styles.field}>
              <span className={styles.label}>Mật khẩu</span>
              <input
                className={styles.input}
                type="password"
                value={form.password}
                onChange={(event) =>
                  updateField("password", event.target.value)
                }
                placeholder="Nhập mật khẩu"
                autoComplete="current-password"
              />
              {errors.password ? (
                <span className={styles.fieldError}>{errors.password}</span>
              ) : null}
            </label>

            {submitError ? (
              <div className={styles.errorBox} role="alert">
                {submitError}
              </div>
            ) : null}

            <div className={styles.actions}>
              <button
                type="submit"
                className={styles.primaryButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Đang xác thực..." : "Đăng nhập"}
              </button>
              <span className={styles.muted}>
                API mặc định: <code>http://localhost:1005</code>
              </span>
            </div>
          </form>
        </section>
      </section>
    </main>
  );
}
