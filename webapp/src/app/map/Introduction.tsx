import { FaLeaf } from 'react-icons/fa';
import { IoMdClose } from 'react-icons/io';

import Heading from '@/components/Heading';
import Icon from '@/components/Icon';
import Text from '@/components/Text';

type IntroductionProps = {
  setIsMapLoading: React.Dispatch<React.SetStateAction<boolean>>;
};

const Introduction = ({ setIsMapLoading }: IntroductionProps) => {
  return (
    <div className="fixed flex flex-col gap-3 bg-white w-[calc(100vw-32px)] lg:w-[630px] top-[50%] left-[50%] p-4 -translate-1/2 rounded-md border z-10">
      <div
        className="absolute right-2 top-2 z-2 cursor-pointer"
        onClick={() => setIsMapLoading(false)}
      >
        <Icon icon={IoMdClose} size="1.5rem" className="!text-black" />
      </div>
      <div className="flex items-center justify-center gap-3">
        <Heading level={2} className="text-green-700">
          Welcome to Manhattan My Way
        </Heading>
        <Icon icon={FaLeaf} className="text-2xl text-green-500" />
      </div>
      <Text.Bold>
        This interactive map helps you explore the most environmentally friendly
        routes across Manhattan.
      </Text.Bold>
      <ol className="list-decimal ml-6">
        <li>
          <Text>
            Select a start and end point to generate multiple route options.
          </Text>
        </li>
        <li>
          <Text>Each route is evaluated based on:</Text>
          <ul className="list-disc ml-6">
            <li>
              <Text.Bold>CO₂ emissions</Text.Bold>
            </li>
            <li>
              <Text.Bold>Air quality index</Text.Bold>
            </li>
            <li>
              <Text.Bold>Busyness</Text.Bold>
            </li>
          </ul>
        </li>
        <li>
          <Text>
            You will receive a <strong>Green Score</strong> (0–100) for each
            route. The higher the score, the greener the route.
          </Text>
        </li>
      </ol>
    </div>
  );
};

export default Introduction;
