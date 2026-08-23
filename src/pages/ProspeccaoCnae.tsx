import CnaeSearch from '../components/CnaeSearch';

export default function ProspeccaoCnae() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10 space-y-4">
      <h1 className="text-2xl font-bold">Prospecção B2B por CNAE</h1>
      <p className="text-sm text-gray-600">
        Use os filtros abaixo para gerar leads por ramo de atividade, estado e cidade.
        Exporte o resultado em CSV para usar no CRM.
      </p>
      <CnaeSearch />
    </div>
  );
}
