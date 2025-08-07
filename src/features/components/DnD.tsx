import { Button, Flex, Text } from "@gravity-ui/uikit";
import { DispatchSourcesContext } from "app/context/context";
import { Source } from "app/context/types";
import { useContext, useRef, useState } from "react";
import { getAudioDuration } from "shared/file";
import { v7 } from "uuid";

const borders = {
  over: "2px solid green",
  notOver: "2px dashed #000",
};
const bgs = {
  over: "#90e8a7",
  notOver: "#d9d9d9",
};

const DnD = () => {
  const ref = useRef<HTMLInputElement>(null);
  const setSources = useContext(DispatchSourcesContext);
  const [mouseOver, setMouseOver] = useState<"over" | "notOver">("notOver");

  function onClick() {
    ref.current?.showPicker();
  }

  async function onChange(event: React.ChangeEvent<HTMLInputElement>) {
    const files = event.target.files;
    const file = (files as FileList)[0];
    const duration = await getAudioDuration(file);

    setSources((prev: Source[]) => {
      return [
        ...prev,
        {
          file: file,
          title: file?.name,
          typeId: null,
          id: v7(),
          cut: {
            start: 0,
            end: duration,
          },
        },
      ];
    });
  }

  async function onDrop(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    setMouseOver("notOver");

    console.log(event);

    const files = event.dataTransfer.files;
    if (files && files.length) {
      const file = files[0];
      const duration = await getAudioDuration(file);

      setSources((prev: Source[]) => {
        return [
          ...prev,
          {
            file: file,
            title: file?.name,
            typeId: null,
            id: v7(),
            playingTime: {
              start: 0,
              end: 0,
            },
            cut: {
              start: 0,
              end: duration,
            },
          },
        ];
      });
    }
  }
  function onDragEnter(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    setMouseOver("over");
  }

  function onDragLeave(event: React.DragEvent) {
    event.preventDefault();
    event.stopPropagation();

    setMouseOver("notOver");
  }

  return (
    <Flex
      justifyContent={"center"}
      style={{
        backgroundColor: bgs[mouseOver],
        padding: "3rem 0 1.5rem 0",
        borderRadius: ".5rem",
        border: borders[mouseOver],
      }}
      // @ts-expect-error - Типы событий Flex компонента не совпадают с React.DragEvent
      onDrop={onDrop}
      // @ts-expect-error - Типы событий Flex компонента не совпадают с React.DragEvent
      onDragOver={onDragEnter}
      // @ts-expect-error - Типы событий Flex компонента не совпадают с React.DragEvent
      onDragLeave={onDragLeave}
    >
      <Flex
        direction={"column"}
        maxWidth={"max-content"}
        alignItems={"center"}
        gap={"2"}
      >
        <input
          type="file"
          name=""
          multiple={false}
          ref={ref}
          onChange={onChange}
          style={{ display: "none" }}
          id=""
        />
        <Button view="action" onClick={onClick}>
          Добавить файл
        </Button>
        <Text>Или перетащите файл сюда</Text>
      </Flex>
    </Flex>
  );
};

export default DnD;
