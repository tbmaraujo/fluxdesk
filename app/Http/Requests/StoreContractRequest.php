<?php

namespace App\Http\Requests;

class StoreContractRequest extends ContractRequest
{
    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return $this->baseRules(false);
    }
}
