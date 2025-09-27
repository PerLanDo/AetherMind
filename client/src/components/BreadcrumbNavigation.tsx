import { useMemo } from "react";
import { useLocation, Link } from "wouter";
import { Home, BarChart3, FileText, CheckSquare, PenTool } from "lucide-react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

const routeConfig: Record<string, BreadcrumbItem> = {
  "/": {
    label: "Projects",
    path: "/",
    icon: Home,
  },
  "/dashboard": {
    label: "Dashboard",
    path: "/dashboard",
    icon: BarChart3,
  },
  "/files": {
    label: "Files",
    path: "/files",
    icon: FileText,
  },
  "/tasks": {
    label: "Tasks",
    path: "/tasks",
    icon: CheckSquare,
  },
  "/ai-tools": {
    label: "AI Tools",
    path: "/ai-tools",
    icon: PenTool,
  },
};

export function BreadcrumbNavigation() {
  const [location] = useLocation();

  const breadcrumbs = useMemo(() => {
    const items: BreadcrumbItem[] = [];
    
    // Always start with Home
    items.push({
      label: "Home",
      path: "/",
      icon: Home,
    });

    // Add current page if it's not home
    if (location && location !== "/") {
      const currentRoute = routeConfig[location];
      if (currentRoute) {
        items.push(currentRoute);
      } else {
        // Handle dynamic routes or unknown paths
        const pathSegments = location.split("/").filter(Boolean);
        pathSegments.forEach((segment, index) => {
          const path = "/" + pathSegments.slice(0, index + 1).join("/");
          const config = routeConfig[path];
          
          if (config) {
            items.push(config);
          } else {
            // Fallback for unknown segments
            items.push({
              label: segment.charAt(0).toUpperCase() + segment.slice(1),
              path: path,
            });
          }
        });
      }
    }

    return items;
  }, [location]);

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs for home page only
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {breadcrumbs.map((item, index) => {
          const isLast = index === breadcrumbs.length - 1;
          const Icon = item.icon;

          return (
            <div key={item.path || item.label} className="flex items-center">
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage className="flex items-center gap-1.5">
                    {Icon && <Icon className="h-4 w-4" />}
                    {item.label}
                  </BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={item.path || "/"} className="flex items-center gap-1.5">
                      {Icon && <Icon className="h-4 w-4" />}
                      {item.label}
                    </Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
              {!isLast && <BreadcrumbSeparator />}
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}