import { SidebarConfig } from "@/components/global/app-sidebar";
import {
  LayoutDashboard,
  FolderOpen,
  PlusCircle,
  UserCheck,
  HandHelping,
  MessageSquare,
  AlertTriangle,
  Search,
  MapPinned,
} from "lucide-react";

const sidebarConfig: SidebarConfig = {
  brand: {
    title: "Sahaya",
    href: "/dashboard",
  },
  sections: [
    {
      label: "Overview",
      items: [
        {
          title: "Dashboard",
          href: "/dashboard",
          icon: LayoutDashboard,
        },
        {
          title: "Cases",
          href: "/cases",
          icon: FolderOpen,
        },
        {
          title: "New Intake",
          href: "/intake",
          icon: PlusCircle,
        },
      ],
    },
    {
      label: "People",
      items: [
        {
          title: "Assignments",
          href: "/assignments",
          icon: UserCheck,
        },
        {
          title: "Volunteers",
          href: "/volunteers",
          icon: HandHelping,
        },
        {
          title: "Messages",
          href: "/messages",
          icon: MessageSquare,
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          title: "Incidents",
          href: "/incidents",
          icon: AlertTriangle,
        },
        {
          title: "Find Cases",
          href: "/volunteer-hub",
          icon: Search,
        },
        {
          title: "Routes",
          href: "/itineraries",
          icon: MapPinned,
        },
      ],
    },
  ],
};

export default sidebarConfig;