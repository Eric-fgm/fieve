import type { Plugin } from "@/types";

export default ((fieve) => ({
	path: "/v1/auth",
	endpoints: ({ get, post, put }) => {
		post("/sign-up", fieve.controller("auth").signUp);

		post("/sign-in", fieve.controller("auth").signIn);

		post("/sign-out", fieve.controller("auth").signOut);

		post("/forgot-password", fieve.controller("auth").forgotPassword);

		post("/reset-password", fieve.controller("auth").resetPassword);

		get("/me", fieve.service("auth").authorize(), fieve.controller("auth").getMe);

		put("/me", fieve.service("auth").authorize(), fieve.controller("auth").updateMe);
	},
})) satisfies Plugin.Routes;
