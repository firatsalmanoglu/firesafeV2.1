import { redirect } from "next/navigation";
import LoginPage from "./login";
import { isLoggedIn } from "@/lib/isLoggedIn";

const Login: React.FC = async () => {

  const loggedIn = await isLoggedIn();
  
  if (loggedIn) {
    redirect("/admin");
  } else {
    return <LoginPage />;
  }
};

export default Login;