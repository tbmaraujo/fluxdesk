<?php

namespace App\Http\Controllers;

use App\Models\Reply;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReplyController extends Controller
{
    /**
     * Store a newly created reply in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\Ticket  $ticket
     * @return \Illuminate\Http\RedirectResponse
     */
    public function store(Request $request, Ticket $ticket)
    {
        $request->validate([
            "content" => "required|string",
            "attachments" => "nullable|array",
            "attachments.*" => "file|max:10240", // 10MB por arquivo
        ]);

        // Check if the user is authorized to reply to the ticket
        if (
            $ticket->user_id !== auth()->id() &&
            $ticket->assignee_id !== auth()->id()
        ) {
            abort(403, "Unauthorized action.");
        }

        $reply = new Reply();
        $reply->content = $request->content;
        $reply->user_id = Auth::id();
        $reply->ticket_id = $ticket->id;
        $reply->save();

        // Processar uploads de anexos
        if ($request->hasFile('attachments')) {
            foreach ($request->file('attachments') as $file) {
                $filename = time() . '_' . $file->getClientOriginalName();
                $path = $file->storeAs('attachments', $filename, 'public');
                
                $reply->attachments()->create([
                    'user_id' => Auth::id(),
                    'filename' => $filename,
                    'original_name' => $file->getClientOriginalName(),
                    'path' => $path,
                    'size' => $file->getSize(),
                    'mime_type' => $file->getMimeType(),
                ]);
            }
        }

        return back();
    }
}
