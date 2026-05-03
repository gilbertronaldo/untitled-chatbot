import Script from "next/script";
import {DataStreamProvider} from "@/components/chat/data-stream-provider";
import {Suspense} from "react";
import {auth} from "@/app/(auth)/auth";
import {cookies} from "next/headers";
import {SidebarInset, SidebarProvider} from "@/components/ui/sidebar";
import {AppSidebar} from "@/components/chat/app-sidebar";
import {Toaster} from "sonner";
import {ActiveChatProvider} from "@/hooks/use-active-chat";
import {ChatShell} from "@/components/chat/shell";
import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {PanelLeftIcon} from "lucide-react";
import Link from "next/link";
import {VercelIcon} from "@/components/chat/icons";
import {VisibilitySelector} from "@/components/chat/visibility-selector";
import DashboardHeader from "@/components/dashboard/dashboard-header";

export default function Layout({children}: { children: React.ReactNode }) {
	return (
		<>
			<Script
				src="https://cdn.jsdelivr.net/pyodide/v0.23.4/full/pyodide.js"
				strategy="lazyOnload"
			/>
			<DataStreamProvider>
				<Suspense fallback={<div className="flex h-dvh bg-sidebar"/>}>
					<SidebarShell>{children}</SidebarShell>
				</Suspense>
			</DataStreamProvider>
		</>
	)
}

async function SidebarShell({children}: { children: React.ReactNode }) {
	const [session, cookieStore] = await Promise.all([auth(), cookies()]);
	const isCollapsed = cookieStore.get("sidebar_state")?.value !== "true";

	return (
		<SidebarProvider defaultOpen={!isCollapsed}>
			<AppSidebar user={session?.user}/>
			<SidebarInset>
				<Toaster
					position="top-center"
					theme="system"
					toastOptions={{
						className:
							"!bg-card !text-foreground !border-border/50 !shadow-[var(--shadow-float)]",
					}}
				/>
				<Suspense fallback={<div className="flex h-dvh"/>}>
					<div className="flex h-dvh w-full flex-row overflow-hidden">
						<div
							className={cn(
								"flex min-w-0 flex-col bg-sidebar transition-[width] duration-300 ease-[cubic-bezier(0.32,0.72,0,1)]",
								false ? "w-[40%]" : "w-full"
							)}
						>
							<DashboardHeader/>

							<div
								className="relative flex min-h-0 flex-1 flex-col overflow-hidden bg-background md:rounded-tl-[12px] md:border-t md:border-l md:border-border/40 p-2">
								{children}
							</div>
						</div>
					</div>
				</Suspense>
			</SidebarInset>
		</SidebarProvider>
	);
}
