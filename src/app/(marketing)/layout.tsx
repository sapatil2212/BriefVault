import { Navbar } from "@/components/landing/navbar/navbar";
import { Footer } from "@/components/landing/footer/footer";

export default function MarketingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      <Navbar />
      <main className="min-h-screen">{children}</main>
      <Footer />
    </>
  );
}
