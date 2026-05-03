'use client';

import {Button} from "@/components/ui/button";
import {PanelLeftIcon} from "lucide-react";
import Link from "next/link";
import {VercelIcon} from "@/components/chat/icons";
import {useSidebar} from "@/components/ui/sidebar";

export default function DashboardHeader() {

	const { state, toggleSidebar, isMobile } = useSidebar();

	if (state === "collapsed" && !isMobile) {
		return null;
	}

	return (
		<header className="sticky top-0 flex h-14 items-center gap-2 bg-sidebar px-3">
			<Button
				className="md:hidden"
				onClick={toggleSidebar}
				size="icon-sm"
				variant="ghost"
			>
				<PanelLeftIcon className="size-4" />
			</Button>

			<Link
				className="flex size-8 items-center justify-center rounded-lg md:hidden"
				href="https://vercel.com/templates/next.js/chatbot"
				rel="noopener noreferrer"
				target="_blank"
			>
				<VercelIcon size={14} />
			</Link>

			{/*{!isReadonly && (*/}
			{/*	<VisibilitySelector*/}
			{/*		chatId={chatId}*/}
			{/*		selectedVisibilityType={selectedVisibilityType}*/}
			{/*	/>*/}
			{/*)}*/}
		</header>
	)
}