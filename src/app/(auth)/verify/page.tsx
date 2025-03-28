import { redirect } from "next/navigation";
import VerificationPage from "./verify";
import { isLoggedIn } from "@/lib/isLoggedIn";


const Verify: React.FC = async () => {
  const loggedIn = await isLoggedIn();

  if (loggedIn) {
    redirect("/");
  } else {
    return <VerificationPage />;
  }
};

export default Verify;
