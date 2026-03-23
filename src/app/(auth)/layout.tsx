export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#f7f8f9] flex flex-col justify-center items-center p-4 selection:bg-gray-200">
      <div className="w-full max-w-lg">
        {/* Logo and Header area */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-auto relative mb-4">
            {/* The provided JPG logo */}
            <img
              src="/414332629_122100699314163177_6128021943999749037_n.jpg"
              alt="Bloomteq Logo"
              className="h-full object-contain mix-blend-multiply"
            />
          </div>
        </div>

        {/* Card Container */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100 p-8 sm:p-12 relative z-10">
          {children}
        </div>

        {/* Aesthetic footer/details if needed */}
        <p className="mt-8 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} Bloomteq. All rights reserved.
        </p>
      </div>
    </div>
  );
}
