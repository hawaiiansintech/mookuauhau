import dynamic from "next/dynamic";
import { useQuery, useLazyQuery, gql } from "@apollo/client";
import React, { useState } from "react";
import DataFormer from "../lib/data-former";
import Button, { ButtonSize } from "../components/Button";

const ForceGraph = dynamic(() => import("../components/ForceGraph"), {
  ssr: false,
});

const get_kanaka = gql`
  query kanakaByXrefidRelations($xref_id: String!) {
    kanaka(where: {xref_id: {_eq: $xref_id}}) {
      kanaka_id
      name
      sex
      residence
      birth_date
      birth_place
      xref_id
      mookuauhau_id
      namakua {
        ohana {
          ohana_id
          xref_id
          kane_id
          wahine_id
          kane {
            kanaka_id
            xref_id
            name
          }
          wahine {
            kanaka_id
            xref_id
            name
          }
        }
      }
      makuakane {
        ohana_id
        xref_id
        kane_id
        wahine {
          kanaka_id
          name
          xref_id
        }
        nakamalii {
          kamalii_id
          ohana {
            ohana_id
            xref_id
          }
          kanaka {
            kanaka_id
            name
            xref_id
            sex
          }
        }
      }
      makuahine {
        ohana_id
        xref_id
        wahine_id
        kane {
          kanaka_id
          name
          xref_id
        }
        nakamalii {
          kamalii_id
          kanaka {
            kanaka_id
            name
            xref_id
            sex
          }
        }
      }
    }
  }
`;

export default function Home() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const formatter = new DataFormer();
  let subGraph: {[k: string]: any} = {};

  const [loadKanakaDescendants] = useLazyQuery(get_kanaka, {
      onCompleted: (data) => {
        console.log(data)
        subGraph = formatter.formatDescendantData(data);
        setGraphData({
          nodes: formatter.getUniqNodes([...graphData.nodes, ...subGraph.nodes]),
          links: [...graphData.links, ...subGraph.links ]
        });
      },
    }
  );

  const [loadKanakaAscendants] = useLazyQuery(get_kanaka, {
      onCompleted: (data) => {
        subGraph = formatter.formatAscendantData(data);
        setGraphData({
          nodes: formatter.getUniqNodes([...graphData.nodes, ...subGraph.nodes]),
          links: [...graphData.links, ...subGraph.links ]
        });
      },
    }
  );

  return (
    <div>
      <Button
        size={ButtonSize.Small}
        customWidth="15rem"
        onClick={() => loadKanakaDescendants({variables: {xref_id: "@I1749@"}})}
        type="submit"
      >Kamehameha I</Button>
      <Button
        size={ButtonSize.Small}
        customWidth="15rem"
        onClick={() => loadKanakaDescendants({variables: {xref_id: "@I489@"}})}
        type="submit"
      >Kekaulike Kalani-kui-hono-i-ka-moku (King of Maui)</Button>
      <ForceGraph
        nodeAutoColorBy={"__typename"}
        nodeLabel={"name"}
        graphData={graphData}
        minZoom={3}
        maxZoom={6}
        dagMode={"td"}
        dagLevelDistance={40}
        onDagError={() => {return "DAG Error"}}
        onNodeClick={(node: any, event) => {
          console.log(node)
          if (node.__typename === 'kanaka') {
            loadKanakaDescendants({ variables: {xref_id: node.id}});
          }
          if (node.index === 0) {
            loadKanakaAscendants({ variables: {xref_id: node.id}});
          }
        }}
      />
    </div>
  );
}
