import DataTableRoulettePriceTypes from '@/components/data-table-roulette-price-types';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { IconArrowLeft } from "@tabler/icons-react";

export default function RoulettePriceTypes() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center gap-4 mb-6 mx-6">
                <Button
                    variant="outline"
                    size="icon"
                    onClick={() => navigate("/roulette")}
                >
                    <IconArrowLeft className="h-4 w-4" />
                </Button>
                <h1 className="text-3xl font-bold">Настройки рулетки</h1>
            </div>
            <DataTableRoulettePriceTypes />
        </div>
    );
}
