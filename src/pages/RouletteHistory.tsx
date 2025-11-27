import DataTableRouletteSpins from '@/components/data-table-roulette-spins';

export default function RouletteHistory() {
    return (
        <div className="container mx-auto py-6">
            <h1 className="text-3xl font-bold mb-6 ml-6">История рулетки</h1>
            <DataTableRouletteSpins />
        </div>
    );
}
