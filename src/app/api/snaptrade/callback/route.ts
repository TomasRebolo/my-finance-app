import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
    // SnapTrade redirects back here after user connects their account
    // We can trigger a sync here or just redirect to dashboard

    const searchParams = request.nextUrl.searchParams;
    const success = searchParams.get("success");

    if (success === "true") {
        // Redirect to dashboard with success message
        return NextResponse.redirect(new URL("/dashboard?snaptrade=connected", request.url));
    } else {
        // Redirect to dashboard with error
        return NextResponse.redirect(new URL("/dashboard?snaptrade=error", request.url));
    }
}
