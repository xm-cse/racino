import Auth from "@/components/Auth";
import Wallet from "@/components/Wallet";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <Auth />
      <Wallet />
    </div>
  );
}
