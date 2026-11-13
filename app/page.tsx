import WelcomePage from "@/components/WelcomePage";
import { programs } from "@/lib/programs";

export default function Home() {
  return <WelcomePage programs={programs} />;
}
