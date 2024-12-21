"use client";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

export default function BackgroundCard() {
  const router = useRouter();

  const handleClick = () => {
    router.push('/public-projects');
  };

  return (
    <div className="w-full h-full">
      <div
        onClick={handleClick}
        className={cn(
          "group w-full h-full cursor-pointer overflow-hidden relative card rounded-md shadow-xl flex flex-col justify-end p-4 border border-transparent dark:border-neutral-800",
          "bg-[url(https://images.unsplash.com/photo-1488972685288-c3fd157d7c7a?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D)] bg-cover bg-center",
          // Preload hover image by setting it in a pseudo-element
          "before:bg-[url(https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80)] before:fixed before:inset-0 before:opacity-0 before:z-[-1]",
          "hover:bg-[url(https://images.unsplash.com/photo-1544077960-604201fe74bc?ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&ixlib=rb-1.2.1&auto=format&fit=crop&w=1651&q=80)]",
          "hover:after:content-[''] hover:after:absolute hover:after:inset-0 hover:after:bg-black hover:after:opacity-50",
          "transition-all duration-500"
        )}
      >
        <div className="text relative z-50">
          <h1 className="font-bold text-xl md:text-2xl text-gray-50 relative">
            Public projects
          </h1>
          <p className="font-normal text-base text-gray-50 relative my-4">
            View all the latest public projects, that suit your profile.
          </p>
        </div>
      </div>
    </div>
  );
}

