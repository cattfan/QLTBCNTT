"use client";

import axios from "axios";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthAccount } from "@repo/shared";
import { fetchCurrentUser } from "./auth-api";
import { LOGIN_ROUTE } from "./auth-routes";
import { clearAuthToken, getAuthToken } from "./auth-storage";
import styles from "./auth-shell.module.css";

export function DashboardShell() {
  const router = useRouter();
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let isActive = true;

    if (!getAuthToken()) {
      router.replace(LOGIN_ROUTE);
      return;
    }

    async function loadSession() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const response = await fetchCurrentUser();

        if (!isActive) {
          return;
        }

        setAccount(response.account);
      } catch (error) {
        if (!isActive) {
          return;
        }

        if (axios.isAxiosError(error) && error.response?.status === 401) {
          return;
        }

        setErrorMessage(
          "Không thể tải thông tin phiên đăng nhập. Kiểm tra backend rồi thử lại.",
        );
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    }

    void loadSession();

    return () => {
      isActive = false;
    };
  }, [router]);

  function handleLogout() {
    clearAuthToken();
    startTransition(() => {
      router.replace(LOGIN_ROUTE);
    });
  }

  return (
    <main className={styles.page}>
      <section className={styles.homeShell}>
        <div className={styles.homeCard}>
          <span className={styles.eyebrow}>Temporary Home</span>
          <h1 className={styles.helloWord}>Hello</h1>

          {isLoading ? (
            <div className={styles.statusBox}>
              <span className={styles.statusLabel}>Session</span>
              <p className={styles.statusValue}>Checking token...</p>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className={styles.errorBox} role="alert">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && account ? (
            <div className={styles.homeMeta}>
              <p className={styles.homeText}>
                Signed in as <strong>{account.email}</strong>.
              </p>
            </div>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>
      </section>
    </main>
  );
/*
  return (
    <main className={styles.page}>
      <section className={styles.shell}>
        <aside className={styles.heroPanel}>
          <div>
            <span className={styles.eyebrow}>Protected Console</span>
            <h1 className={styles.headline}>
              Phiên làm việc đang được
              <span className={styles.headlineAccent}> xác thực </span>
              bằng JWT.
            </h1>
          </div>

          <p className={styles.lead}>
            Mọi request từ frontend sẽ tự đính kèm bearer token. Nếu backend
            trả về <code>401</code>, interceptor sẽ xóa token và điều hướng bạn
            về màn hình đăng nhập.
          </p>

          <div className={styles.heroGrid}>
            <div className={styles.heroCard}>
              <span className={styles.heroLabel}>API endpoint</span>
              <p className={styles.heroValue}>{API_BASE_URL}</p>
            </div>
            <div className={styles.heroCard}>
              <span className={styles.heroLabel}>Auth guard</span>
              <p className={styles.heroValue}>Enabled</p>
            </div>
          </div>
        </aside>

        <section className={styles.contentPanel}>
          <div className={styles.dashboardHeader}>
            <div>
              <h2 className={styles.sectionTitle}>Phiên đăng nhập hiện tại</h2>
              <p className={styles.sectionLead}>
                Trang này gọi <code>/auth/me</code> để xác minh token và hiển
                thị thông tin người dùng hiện tại.
              </p>
            </div>
            <div className={styles.badge}>
              <span className={styles.dot} />
              Protected route
            </div>
          </div>

          {isLoading ? (
            <div className={styles.statusBox}>
              <span className={styles.statusLabel}>Đang xử lý</span>
              <p className={styles.statusValue}>Đang xác minh token...</p>
            </div>
          ) : null}

          {!isLoading && errorMessage ? (
            <div className={styles.errorBox} role="alert">
              {errorMessage}
            </div>
          ) : null}

          {!isLoading && account ? (
            <div className={styles.profileCard}>
              <span className={styles.profileLabel}>Thông tin tài khoản</span>
              <div className={styles.profileRow}>
                <span>Họ tên</span>
                <span>{account.name}</span>
              </div>
              <div className={styles.profileRow}>
                <span>Email</span>
                <span>{account.email}</span>
              </div>
              <div className={styles.profileRow}>
                <span>Mã tài khoản</span>
                <span>{account.id}</span>
              </div>
            </div>
          ) : null}

          <div className={styles.actions}>
            <button
              type="button"
              className={styles.primaryButton}
              onClick={handleLogout}
            >
              Đăng xuất
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={() => setReloadKey((currentKey) => currentKey + 1)}
            >
              Tải lại phiên
            </button>
            <span className={styles.muted}>
              Khi token không hợp lệ, giao diện sẽ quay lại <code>/login</code>.
            </span>
          </div>
        </section>
      </section>
    </main>
  );
*/
}
