import { redirect } from "next/navigation";
import RegisterPage from "./register";
import { isLoggedIn } from "@/lib/isLoggedIn";


const Register: React.FC = async () => {
  const loggedIn = await isLoggedIn();

  if (loggedIn) {
    redirect("/");
  } else {
    return <RegisterPage />;
  }
};

export default Register;