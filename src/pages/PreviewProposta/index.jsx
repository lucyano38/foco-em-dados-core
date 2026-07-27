import { useParams } from 'react-router-dom';

export default function PreviewProposta() {
  const { id } = useParams();
  
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-4">Preview da Proposta</h1>
      <p className="text-gray-600">Visualizando a proposta ID: {id}</p>
      {/* Aqui renderizaremos o visual do site que o cliente vai aprovar */}
    </div>
  );
}
