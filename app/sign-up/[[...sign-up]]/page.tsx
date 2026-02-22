import { SignUp } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#0b0f17] flex items-center justify-center px-4">
      <SignUp />
    </div>
  );
}
