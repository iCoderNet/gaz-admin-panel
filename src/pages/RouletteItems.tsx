import DataTableRouletteItems from '@/components/data-table-roulette-items'; // Re-import
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function RouletteItems() {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto py-6">
            <div className="flex items-center justify-between mb-6 mx-6">
                <h1 className="text-3xl font-bold">Рулетка</h1>

                <div className='flex gap-2'>
                    <Button
                        onClick={() => navigate("/roulette/forced-roulette-rules")}
                    >
                        Принудительные призы рулетки
                    </Button>
                    <Button
                        onClick={() => navigate("/roulette/history")}
                    >
                        История рулетки
                    </Button>
                </div>
            </div>
            <DataTableRouletteItems />
        </div>
    );
}
