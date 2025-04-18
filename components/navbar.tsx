"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, Menu, X, Bell, Sun, Moon, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"

export default function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")
  const { setTheme, theme } = useTheme()
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()

  const isLoggedIn = status === "authenticated"
  const user = session?.user

  // Initialize selected subject from URL params
  useEffect(() => {
    setSelectedSubject(searchParams.get('subject') || "")
  }, [searchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const handleSubjectSelect = (subjectValue: string) => {
    const newSubject = subjectValue === selectedSubject ? "" : subjectValue;
    setSelectedSubject(newSubject);
    
    // Update URL with new subject filter and force reload
    const params = new URLSearchParams();
    if (newSubject) params.set('subject', newSubject);
    params.delete('q'); 
    
    // Use router.push instead of replace to ensure page reload
    router.push(`/?${params.toString()}`);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: false })
    router.push("/")
  }

  const subjects = [
   
    {
      title: "Web Development",
      value: "web-development",
      description: "HTML, CSS, JavaScript, Frontend Frameworks"
    },
    {
      title: "Backend Development",
      value: "backend-development",
      description: "Node.js, Django, APIs, Databases"
    },
    {
      title: "Mobile Development",
      value: "mobile-development",
      description: "React Native, Flutter, Swift, Kotlin"
    },
    {
      title: "Data Structures & Algorithms",
      value: "dsa",
      description: "Arrays, Trees, Graphs, Sorting, Searching"
    },
    {
      title: "Machine Learning",
      value: "machine-learning",
      description: "Neural Networks, TensorFlow, PyTorch, AI"
    },
    {
      title: "Cybersecurity",
      value: "cybersecurity",
      description: "Encryption, Ethical Hacking, Network Security"
    },
    {
      title: "Cloud Computing",
      value: "cloud-computing",
      description: "AWS, Azure, GCP, Serverless Architecture"
    },
    {
      title: "DevOps",
      value: "devops",
      description: "CI/CD, Docker, Kubernetes, Infrastructure"
    },
    {
      title: "Blockchain",
      value: "blockchain",
      description: "Smart Contracts, Cryptocurrency, Web3"
    },
    {
      title: "Game Development",
      value: "game-development",
      description: "Unity, Unreal Engine, Game Design"
    },
    {
      title: "Data Science",
      value: "data-science",
      description: "Python, R, SQL, Data Visualization"
    }
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <div className="flex items-center mr-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">PeerHelp</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden md:flex md:flex-1">
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <Link href="/" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Home</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <NavigationMenuTrigger>Subjects</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {subjects.map((subject) => (
                      <li key={subject.value}>
                        <NavigationMenuLink asChild>
                          <div
                            onClick={() => handleSubjectSelect(subject.value)}
                            className={`block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer ${
                              selectedSubject === subject.value ? "bg-accent" : ""
                            }`}
                          >
                            <div className="text-sm font-medium leading-none">{subject.title}</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              {subject.description}
                            </p>
                          </div>
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <Link href="/ask" legacyBehavior passHref>
                  <NavigationMenuLink className={navigationMenuTriggerStyle()}>Ask Question</NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="ml-auto flex items-center space-x-4">
            <form
              onSubmit={handleSearch}
              className={cn("relative transition-all duration-300 ease-in-out", isSearchOpen ? "w-64" : "w-9")}
            >
              <Button
                variant="ghost"
                size="icon"
                className={cn("absolute right-0 top-0", isSearchOpen ? "text-muted-foreground" : "")}
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                type="button"
              >
                {isSearchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
              </Button>
              <div
                className={cn(
                  "overflow-hidden transition-all duration-300 ease-in-out",
                  isSearchOpen ? "opacity-100 max-w-full" : "opacity-0 max-w-0",
                )}
              >
                <Input
                  placeholder="Search questions..."
                  className="pr-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme("light")}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("dark")}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme("system")}>
                  <Laptop className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isLoggedIn ? (
              <>
                <Button variant="ghost" size="icon">
                  <Bell className="h-5 w-5" />
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "User"} />
                        <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user?.name}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/users/${user?.id}`}>Profile</Link>
                    </DropdownMenuItem>
                    
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>Log out</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="outline" size="sm">
                    Log in
                  </Button>
                </Link>
                <Link href="/login?tab=signup">
                  <Button size="sm">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile menu button */}
        <div className="flex md:hidden ml-auto items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <Search className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile search bar */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isSearchOpen ? "max-h-14 opacity-100 border-b" : "max-h-0 opacity-0",
        )}
      >
        <form onSubmit={handleSearch} className="container py-2">
          <Input
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </form>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          "md:hidden overflow-hidden transition-all duration-300 ease-in-out",
          isMobileMenuOpen ? "max-h-[400px] opacity-100 border-b" : "max-h-0 opacity-0",
        )}
      >
        <nav className="container py-4 space-y-4">
          <Link href="/" className="flex w-full py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
            Home
          </Link>
          
          <div className="flex flex-col">
            <p className="py-2 text-lg font-medium">Subjects</p>
            <div className="grid grid-cols-2 gap-2">
              {subjects.map((subject) => (
                <Button
                  key={subject.value}
                  variant={selectedSubject === subject.value ? "outline" : "ghost"}
                  className="justify-start"
                  onClick={() => {
                    handleSubjectSelect(subject.value)
                    setIsMobileMenuOpen(false)
                  }}
                >
                  {subject.title}
                </Button>
              ))}
            </div>
          </div>
          
          <Link href="/ask" className="flex w-full py-2 text-lg font-medium" onClick={() => setIsMobileMenuOpen(false)}>
            Ask Question
          </Link>
          
          <div className="pt-4 border-t">
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user?.image || "/placeholder.svg"} alt={user?.name || "User"} />
                  <AvatarFallback>{user?.name?.[0] || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user?.name}</p>
                  <Link href={`/users/${user?.id}`} className="text-xs text-muted-foreground">
                    View profile
                  </Link>
                </div>
                <Button variant="ghost" size="sm" className="ml-auto" onClick={handleLogout}>
                  Log out
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link href="/login" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">
                    Log in
                  </Button>
                </Link>
                <Link href="/login?tab=signup" className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full">Sign up</Button>
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </header>
  )
}