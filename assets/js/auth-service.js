import { supabase } from "./supabase.js";

class AuthService {
  constructor() {
    this.tokenKey = "shift1m_token";
    this.userKey = "shift1m_user";
  }

  // Pindahkan resizeImage ke dalam class sebagai method
  async resizeImage(file, maxWidth = 800) {
    return new Promise((resolve, reject) => {
      // Validasi tipe file
      if (!this.allowedImageTypes.includes(file.type)) {
        reject(
          new Error("Invalid file type. Only JPG, PNG and GIF are allowed.")
        );
        return;
      }

      const reader = new FileReader();

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.onload = (e) => {
        const img = new Image();

        img.onerror = () => {
          reject(new Error("Failed to load image"));
        };

        img.onload = () => {
          try {
            const canvas = document.createElement("canvas");
            const size = Math.min(img.width, img.height);
            const startX = (img.width - size) / 2;
            const startY = (img.height - size) / 2;

            let finalSize = size;
            if (size > maxWidth) {
              finalSize = maxWidth;
            }

            canvas.width = finalSize;
            canvas.height = finalSize;

            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "white";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            ctx.drawImage(
              img,
              startX,
              startY,
              size,
              size,
              0,
              0,
              finalSize,
              finalSize
            );

            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to create image blob"));
                  return;
                }
                resolve(
                  new File([blob], file.name, {
                    type: "image/jpeg",
                    lastModified: Date.now(),
                  })
                );
              },
              "image/jpeg",
              0.8
            );
          } catch (error) {
            reject(error);
          }
        };
        img.src = e.target.result;
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Register a new user in Supabase
   */
  async register(email, password, fullName) {
    try {
      const redirectUrl = `${window.location.origin}../../confirm-email.html`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) {
        console.error("Registration failed:", error.message);
        throw new Error(error.message);
      }

      if (data?.user?.confirmation_sent_at) {
        alert("Please check your email to confirm your account.");
        window.location.href = "../../check-email.html";
        return data;
      }

      const { data: signInData, error: signInError } =
        await supabase.auth.signInWithPassword({
          email,
          password,
        });

      if (signInError) {
        throw new Error(signInError.message);
      }

      const { error: insertError } = await supabase.from("users").insert({
        id: data.user.id,
        email,
        full_name: fullName,
      });

      if (insertError) {
        console.error("Failed to save user details:", insertError.message);
        throw new Error(insertError.message);
      }

      if (signInData.session) {
        localStorage.setItem(this.tokenKey, signInData.session.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(signInData.user));
        window.location.href = "/home.html";
      }

      return data;
    } catch (error) {
      console.error("Registration process failed:", error.message);
      alert(error.message);
      throw error;
    }
  }

  /**
   * Handle email confirmation
   */
  async handleEmailConfirmation() {
    try {
      const { data, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (data?.session) {
        localStorage.setItem(this.tokenKey, data.session.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(data.session.user));

        const { error: upsertError } = await supabase.from("users").upsert(
          {
            id: data.session.user.id,
            email: data.session.user.email,
            full_name: data.session.user.user_metadata?.full_name,
          },
          { onConflict: "id" }
        );

        if (upsertError) {
          console.error("Failed to update user details:", upsertError.message);
        }

        return { success: true };
      }

      return { success: false, error: "No session found" };
    } catch (error) {
      console.error("Email confirmation failed:", error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Log in user with email and password
   */
  async login(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes("Invalid login credentials")) {
          throw new Error("Email atau password salah");
        }
        if (error.message.includes("Email not confirmed")) {
          throw new Error("Silakan konfirmasi email Anda terlebih dahulu");
        }
        if (error.message.includes("Email not found")) {
          throw new Error("Email tidak ditemukan");
        }
        throw new Error(error.message);
      }

      if (data.session) {
        localStorage.setItem(this.tokenKey, data.session.access_token);
        localStorage.setItem(this.userKey, JSON.stringify(data.user));
        window.location.href = "/home.html";
      }

      return data.user;
    } catch (error) {
      console.error("Login failed:", error.message);
      alert(error.message);
      throw error;
    }
  }

  /**
   * Log out the current user
   */
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      window.location.href = "/login.html";
    } catch (error) {
      console.error("Logout failed:", error.message);
      throw error;
    }
  }

  /**
   * Check if a user is authenticated
   */
  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  /**
   * Get the current logged-in user
   */
  getCurrentUser() {
    const userStr = localStorage.getItem(this.userKey);
    return userStr ? JSON.parse(userStr) : null;
  }

  /**
   * Redirect to home if authenticated
   */
  redirectIfAuthenticated() {
    if (this.isAuthenticated()) {
      window.location.href = "/home.html";
      return true;
    }
    return false;
  }

  // Tambahkan method ini di class AuthService
  // Modifikasi method uploadAvatar untuk menggunakan resizeImage
  async uploadAvatar(file, onProgress) {
    try {
      // Resize image sebelum upload
      const resizedFile = await this.resizeImage(file);

      const user = this.getCurrentUser();
      const fileExt = "jpg"; // Karena kita selalu convert ke JPEG
      const fileName = `${user.id}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from("avatars")
        .upload(`profiles/${fileName}`, resizedFile, {
          upsert: true,
          contentType: "image/jpeg",
          onUploadProgress: (progress) => {
            if (onProgress) {
              const percentage = (progress.loaded / progress.total) * 100;
              onProgress(percentage);
            }
          },
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(`profiles/${fileName}`);

      const { data: userData, error: updateError } =
        await supabase.auth.updateUser({
          data: {
            ...user.user_metadata,
            avatar_url: publicUrl,
          },
        });

      if (updateError) throw updateError;

      const currentUser = this.getCurrentUser();
      currentUser.user_metadata = {
        ...currentUser.user_metadata,
        avatar_url: publicUrl,
      };
      localStorage.setItem(this.userKey, JSON.stringify(currentUser));

      return publicUrl;
    } catch (error) {
      console.error("Error uploading avatar:", error);
      throw error;
    }
  }

  async deleteAvatar() {
    try {
      const user = this.getCurrentUser();
      const { data: files } = await supabase.storage
        .from("avatars")
        .list("profiles/");

      // Hapus semua file dengan awalan ID user
      const filesToDelete = files
        .filter((file) => file.name.startsWith(user.id))
        .map((file) => `profiles/${file.name}`);

      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from("avatars")
          .remove(filesToDelete);

        if (deleteError) throw deleteError;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          avatar_url: null,
        },
      });

      if (updateError) throw updateError;

      // Update local storage
      const currentUser = this.getCurrentUser();
      currentUser.user_metadata = {
        ...currentUser.user_metadata,
        avatar_url: null,
      };
      localStorage.setItem(this.userKey, JSON.stringify(currentUser));
    } catch (error) {
      console.error("Error deleting avatar:", error);
      throw error;
    }
  }
}

const authService = new AuthService();
export default authService;
