<?php

use App\Models\Client;
use App\Models\Ticket;
use App\Models\Reply;
use App\Models\Service;
use App\Models\User;
use App\Models\Appointment;
use App\Models\Attachment;
use App\Models\Contract;
use App\Models\Displacement;

// Atualizar o modelo Client
$clientPath = app_path('Models/Client.php');
$clientContent = file_get_contents($clientPath);
if (strpos($clientContent, 'use BelongsToTenant;') === false) {
    $clientContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $clientContent
    );
    file_put_contents($clientPath, $clientContent);
    echo "Updated Client model.\n";
}

// Atualizar o modelo Ticket
$ticketPath = app_path('Models/Ticket.php');
$ticketContent = file_get_contents($ticketPath);
if (strpos($ticketContent, 'use BelongsToTenant;') === false) {
    $ticketContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $ticketContent
    );
    file_put_contents($ticketPath, $ticketContent);
    echo "Updated Ticket model.\n";
}

// Atualizar o modelo Reply
$replyPath = app_path('Models/Reply.php');
$replyContent = file_get_contents($replyPath);
if (strpos($replyContent, 'use BelongsToTenant;') === false) {
    $replyContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $replyContent
    );
    file_put_contents($replyPath, $replyContent);
    echo "Updated Reply model.\n";
}

// Atualizar o modelo Service
$servicePath = app_path('Models/Service.php');
$serviceContent = file_get_contents($servicePath);
if (strpos($serviceContent, 'use BelongsToTenant;') === false) {
    $serviceContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $serviceContent
    );
    file_put_contents($servicePath, $serviceContent);
    echo "Updated Service model.\n";
}

// Atualizar o modelo Appointment
$appointmentPath = app_path('Models/Appointment.php');
$appointmentContent = file_get_contents($appointmentPath);
if (strpos($appointmentContent, 'use BelongsToTenant;') === false) {
    $appointmentContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $appointmentContent
    );
    file_put_contents($appointmentPath, $appointmentContent);
    echo "Updated Appointment model.\n";
}

// Atualizar o modelo Attachment
$attachmentPath = app_path('Models/Attachment.php');
$attachmentContent = file_get_contents($attachmentPath);
if (strpos($attachmentContent, 'use BelongsToTenant;') === false) {
    $attachmentContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $attachmentContent
    );
    file_put_contents($attachmentPath, $attachmentContent);
    echo "Updated Attachment model.\n";
}

// Atualizar o modelo Contract
$contractPath = app_path('Models/Contract.php');
$contractContent = file_get_contents($contractPath);
if (strpos($contractContent, 'use BelongsToTenant;') === false) {
    $contractContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $contractContent
    );
    file_put_contents($contractPath, $contractContent);
    echo "Updated Contract model.\n";
}

// Atualizar o modelo Displacement
$displacementPath = app_path('Models/Displacement.php');
$displacementContent = file_get_contents($displacementPath);
if (strpos($displacementContent, 'use BelongsToTenant;') === false) {
    $displacementContent = str_replace(
        'use HasFactory;',
        "use HasFactory;\n    use \\App\\Models\\Traits\\BelongsToTenant;",
        $displacementContent
    );
    file_put_contents($displacementPath, $displacementContent);
    echo "Updated Displacement model.\n";
}

echo "All models have been updated with the BelongsToTenant trait.\n";
