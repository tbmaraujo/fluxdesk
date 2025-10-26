<?php

namespace App\Http\Requests;

class UpdateContractRequest extends ContractRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return $this->baseRules(true);
    }
}
